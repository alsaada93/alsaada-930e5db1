import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // نُدير استرجاع موضع التمرير يدوياً في __root لدعم القوائم التي تُحمَّل لاحقاً
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
