import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Portal from "@/pages/Portal";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import LanguageToggle from "./components/LanguageToggle";
import LocaleTranslationBridge from "./components/LocaleTranslationBridge";
import Home from "./pages/Home";
import Register from "./pages/Register";
import StatusPage from "@/pages/StatusPage";
import PublicPortal from "@/pages/PublicPortal";
import Pricing from "@/pages/Pricing";
import PreviewPortals from "@/pages/PreviewPortals";
import Discover from "@/pages/Discover";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/status" component={StatusPage} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/discover" component={Discover} />
      <Route path="/login" component={Register} />
      <Route path="/login/:portal" component={Register} />
      <Route path="/register" component={Register} />
      <Route path="/register/:portal" component={Register} />
      <Route path="/portal/:portal" component={PublicPortal} />
      <Route path="/preview" component={PreviewPortals} />
      <Route path="/preview/:portal" component={PreviewPortals} />
      <Route path="/app" component={Portal} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();

  return <ErrorBoundary><LocaleProvider><ThemeProvider defaultTheme="system" switchable><TooltipProvider><Toaster /><Router /><LocaleTranslationBridge />{location.split("?")[0] !== "/" ? <LanguageToggle className="global-language-toggle" /> : null}</TooltipProvider></ThemeProvider></LocaleProvider></ErrorBoundary>;
}

export default App;
