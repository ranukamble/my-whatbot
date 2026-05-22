import { Layout } from "@/components/Layout";
import Campaigns from "@/pages/Campaigns";
import ContactListDetail from "@/pages/ContactListDetail";
import Contacts from "@/pages/Contacts";
import Dashboard from "@/pages/Dashboard";
import Groups from "@/pages/Groups";
import History from "@/pages/History";
import WhatsApp from "@/pages/WhatsApp";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRootRoute, createRoute } from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const campaignsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/campaigns",
  component: Campaigns,
});

const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts",
  component: Contacts,
});

const contactListDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts/$listId",
  component: ContactListDetail,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: History,
});

const whatsappRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/whatsapp",
  component: WhatsApp,
});

const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups",
  component: Groups,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  campaignsRoute,
  contactsRoute,
  contactListDetailRoute,
  historyRoute,
  whatsappRoute,
  groupsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
