import { RouteConfig } from "@/types";

export const routeConfig: RouteConfig = {
  publicRoutes: ['/search', '/property' , '/sitemap_index.xml'],
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
      allowedRoutes: ['/customer'],
      redirectTo: '/',
      defaultRoute: '/'
    }
  } 
};