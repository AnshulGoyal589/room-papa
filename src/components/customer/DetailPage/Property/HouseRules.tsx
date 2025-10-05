import { Property } from "@/lib/mongodb/models/Property";
import { 
    Info, 
    LogIn, 
    LogOut, 
    PartyPopper, 
    PawPrint,
    User, 
} from "lucide-react";

// A small component for visual flair, matching the screenshot.
// const CreditCardLogos = () => (
//     <div className="flex items-center flex-wrap gap-2 mt-2">
//         <Image src="/cards/amex.svg" alt="American Express" width={38} height={24} />
//         <Image src="/cards/visa.svg" alt="Visa" width={38} height={24} />
//         <Image src="/cards/mastercard.svg" alt="Mastercard" width={38} height={24} />
//         <Image src="/cards/jcb.svg" alt="JCB" width={38} height={24} />
//         <Image src="/cards/maestro.svg" alt="Maestro" width={38} height={24} />
//         <Image src="/cards/discover.svg" alt="Discover" width={38} height={24} />
//     </div>
// );


const RuleRow: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => {
    // This check prevents rendering empty rows if specific rule data is not provided.
    if (!children) return null;

    return (
        <div className="flex flex-col sm:flex-row py-5 border-b border-gray-200 last:border-b-0">
            {/* A more robust layout: Fixed width title column on larger screens */}
            <div className="w-full sm:w-64 flex items-center mb-2 sm:mb-0 shrink-0">
                <Icon className="h-6 w-6 mr-4 text-gray-700 shrink-0" />
                <span className="font-semibold text-slate-800 text-base">{title}</span>
            </div>
            <div className="w-full flex-grow text-slate-600 text-sm pl-10 sm:pl-4">
                {children}
            </div>
        </div>
    );
};

export const HouseRules = ({ rules }: { rules: Property['houseRules'] }) => {
    if (!rules) return null;

    const hasAnyRule = rules.checkInTime || rules.checkOutTime || rules.petsAllowed !== undefined || rules.partiesAllowed !== undefined || (rules.additionalRules && rules.additionalRules.length > 0);
    
    // If no rules are set, don't render this section to avoid an empty card.
    if (!hasAnyRule) return null;

    return (
        <div id="house-rules" className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-md my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">House rules</h2>
            
            {/* --- Data From Your Schema --- */}
            <RuleRow icon={LogIn} title="Check-in">
                {rules.checkInTime ? `From ${rules.checkInTime}` : null}
            </RuleRow>
            
            <RuleRow icon={LogOut} title="Check-out">
                {rules.checkOutTime ? `Before ${rules.checkOutTime}` : null}
            </RuleRow>

            <RuleRow icon={PawPrint} title="Pets">
                {rules.petsAllowed ? 'Pets are welcome.' : 'Pets are not allowed.'}
            </RuleRow>

            <RuleRow icon={PartyPopper} title="Parties">
                {rules.partiesAllowed ? 'Parties/events are allowed.' : 'Parties/events are not allowed.'}
            </RuleRow>

            {rules.additionalRules && rules.additionalRules.length > 0 && (
                 <RuleRow icon={Info} title="Additional Rules">
                    <ul className="list-disc list-inside space-y-1.5">
                        {rules.additionalRules.map((rule, index) => <li key={index}>{rule}</li>)}
                    </ul>
                </RuleRow>
            )}

            <RuleRow icon={Info} title="Cancellation/ prepayment">
                <p>Cancellation and prepayment policies vary by room type and provider. Please check the conditions of your specific booking.</p>
            </RuleRow>
            
            <RuleRow icon={User} title="Age restriction">
                <p>The minimum age for check-in is 18.</p>
            </RuleRow>
            
        </div>
    );
};