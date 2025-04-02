import { RouteConfig } from "@/types";

export const routeConfig: RouteConfig = {
  publicRoutes: ['/customer','/login', '/register',],
  roleRoutes: {
    admin: {
      allowedRoutes: ['/admin'],
      redirectTo: '/admin/dashboard',
      defaultRoute: '/admin/dashboard'
    },
    manager: {
      allowedRoutes: ['/manager'],
      redirectTo: '/manager/dashboard',
      defaultRoute: '/manager/dashboard'
    },
    customer: {
      // allowedRoutes: ['/home','/shops', '/query', '/order-history', '/profile','/track-order','/orders','/get-appointment','/listed-products','/product-details','/cart','/products','/my-orders','/add-new-product','/get-it-fixed','/ecommerce-orders', '/receipt','/missing-information','/missing-info'],
      allowedRoutes: ['/customer'],
      redirectTo: '/customer/dashboard',
      defaultRoute: '/customer/dashboard'
    }
  } 
};