'use client';

import React, { useState } from 'react';

const loadRazorpayScript = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: any;
    }
}

export interface RazorpayPaymentButtonProps {
    amountInSubunits: number;
    currency: string;
    receiptId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bookingPayload: any;
    prefill: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string | number | boolean>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onPaymentSuccess: (confirmationData: any) => void;
    onPaymentError: (errorMessage: string) => void;
    razorpayKeyId: string;
    companyName: string;
    companyLogoUrl?: string;
    disabled?: boolean;
    buttonText?: string;
    themeColor?: string;
    className?: string;
}

const RazorpayPaymentButton: React.FC<RazorpayPaymentButtonProps> = ({
    amountInSubunits,
    currency,
    receiptId,
    bookingPayload,
    prefill,
    notes,
    onPaymentSuccess,
    onPaymentError,
    razorpayKeyId,
    companyName,
    companyLogoUrl,
    disabled = false,
    buttonText = "Proceed to Pay",
    themeColor = "#3B82F6",
    className = "w-full bg-[#003c95] text-white py-2.5 px-4 rounded-lg font-semibold text-md hover:bg-[#003c95] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#003c95] disabled:bg-[#003c95] disabled:cursor-wait shadow-md",
}) => {
    const [isProcessing, setIsProcessing] = useState(false);

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    // const sendMail = async ( bookingPayload: any) => {
    //     try {
    //         const response = await fetch('/api/bookings', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify(bookingPayload)
    //         });
    //         if (!response.ok) {
    //             const errorData = await response.json();
    //             throw new Error(errorData.message || 'Failed to send email');
    //         }
    //     } catch (error) {
    //         console.error('Error sending booking confirmation email:', error);
    //     }
    // };

    const handlePayment = async () => {
        if (!razorpayKeyId) {
            onPaymentError("Payment gateway key is not configured.");
            return;
        }
        if (amountInSubunits <= 0) {
            onPaymentError("Invalid payment amount.");
            return;
        }

        setIsProcessing(true);
        onPaymentError("");

        const scriptLoaded = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!scriptLoaded) {
            onPaymentError("Failed to load payment gateway. Please check your internet connection and try again.");
            setIsProcessing(false);
            return;
        }

        try {
            const orderResponse = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountInSubunits,
                    currency: currency,
                    receipt: receiptId,
                }),
            });

            if (!orderResponse.ok) {
                const errorData = await orderResponse.json().catch(() => ({ message: "Failed to create payment order on server." }));
                throw new Error(errorData.message || `Server error: ${orderResponse.status}`);
            }

            const orderData = await orderResponse.json();
            const { id: order_id, amount: backendAmount, currency: backendCurrency } = orderData;
            const options = {
                key: razorpayKeyId,
                amount: backendAmount.toString(),
                currency: backendCurrency,
                name: companyName,
                description: `Booking payment for receipt: ${receiptId}`,
                image: companyLogoUrl,
                order_id: order_id,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                handler: async function (response: any) {
                    try {
                        const verificationResponse = await fetch('/api/bookings/confirm-with-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                bookingPayload: bookingPayload,
                            }),
                        });

                        if (!verificationResponse.ok) {
                            const errorData = await verificationResponse.json().catch(() => ({ message: "Payment verification failed on server." }));
                            throw new Error(errorData.message || `Server verification error: ${verificationResponse.status}`);
                        }

                        const confirmationData = await verificationResponse.json();
                        // await sendMail( bookingPayload);

                        onPaymentSuccess(confirmationData);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (verificationError: any) {
                        console.error("Payment verification/booking creation error:", verificationError);
                        onPaymentError(`Payment Succeeded but booking confirmation failed: ${verificationError.message}. Please contact support with Order ID ${order_id} and Payment ID ${response.razorpay_payment_id}.`);
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: prefill,
                notes: notes,
                theme: {
                    color: themeColor,
                },
                modal: {
                    ondismiss: function () {
                        if (isProcessing) {
                            onPaymentError("Payment was cancelled or modal closed.");
                            setIsProcessing(false);
                        }
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rzp.on('payment.failed', function (response: any) {
                console.error("Razorpay payment failed event:", response.error);
                const readableError = response.error.description || `Payment Failed (Code: ${response.error.code})`;
                const orderInfo = response.error.metadata?.order_id ? ` Order ID: ${response.error.metadata.order_id}` : '';
                const paymentInfo = response.error.metadata?.payment_id ? ` Payment ID: ${response.error.metadata.payment_id}` : '';
                onPaymentError(`${readableError}.${orderInfo}${paymentInfo}`);
                setIsProcessing(false);
            });
            rzp.open();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Payment initiation error:", error);
            onPaymentError(error.message || "An unexpected error occurred while initiating payment.");
            setIsProcessing(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handlePayment}
            disabled={disabled || isProcessing}
            className={className}
        >
            {isProcessing ? (
                <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                </span>
            ) : (
                buttonText
            )}
        </button>
    );
};

export default RazorpayPaymentButton;