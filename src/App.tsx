import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./client/contexts/ThemeContext";
import ForgotPassword from "./client/common/ForgotPassword";
import PreloaderAnimation from "./client/common/Preloader";
import NotificationProvider from "./client/Notification/Notification.tsx";
import MTMCalculator from './client/MTMCalculator/MTMCalculator';
import MTMRateInput from './client/MTMRateInput/MTMRateInput';

// Lazy load components
const Users = lazy(() => import("./client/uam/Users"));
const UserCreationForm = lazy(
  () => import("./client/uam/Users/UserCreationForm")
);
const NewDashboard = lazy(() => import("./client/NewDashboard/Dashboard"));
const Roles = lazy(() => import("./client/uam/Roles/index"));
const RoleCreation = lazy(() => import("./client/uam/Roles/RoleCreationForm"));
const FxWizard = lazy(() => import("./client/fx/fxWizard/index.tsx"));
const OutputTabs = lazy(() => import("./client/fx/fxWizard/outputIndex.tsx"));
const MTMUploader = lazy(() => import("./client/MTMCalculator/MTMUploader.tsx"));
const Permission = lazy(() => import("./client/uam/Permission/index"));
const ExposureBucketing = lazy(
  () => import("./client/fx/exposureBucketing.tsx/index.tsx")
);
const ExposureUpload = lazy(
  () => import("./client/fx/exposureUpload.tsx/index.tsx")
);
const Hedgingproposal = lazy(
  () => import("./client/fx/hedgingproposal/index.tsx")
);
const Entity = lazy(() => import("./client/entity/EntityCreation"));
const Hierarchical = lazy(() => import("./client/entity/entityHiearchy"));
const CFODashboard = lazy(
  () => import("./client/CFODashboard/CFODashboard.tsx")
);
const OPSDashboard = lazy(
  () => import("./client/OPSDashboard/OPSDashboard.tsx")
);
const NetExposure = lazy(
  () => import("./client/fx/NetPosition/netPosition.tsx")
);
// const FXForwardBookingForm = lazy(() => import("./client/fx/NetPosition/FxBooking.tsx"));
const FxConfirmationPage = lazy(
  () => import("./client/fx/fxConfirmation/index.tsx")
);
// const LinkingScreen = lazy(() => import("./client/linkingScreen/index.tsx"));
const LinkingScreen = lazy(() => import("./client/linkingScreen/Exp/exp1.tsx"));
const FxForward = lazy(() => import("./client/fx/fxForward/index.tsx"));
const FxCancellation = lazy(
  () => import("./client/fx/fxCancellation/index.tsx")
);
const CFODashboardBuilder = lazy(
  () => import("./client/DashboardBuilder/DashboardBuilder.tsx")
);
// const ExposureSelection = lazy(() => import("./client/Settlement/ExposureSelection.tsx"));
const Reports = lazy(() => import("./client/Reports/Reports.tsx"));
const PaymentRollover = lazy(() => import("./client/Settlement/index.tsx"));
const ExposureSelection = lazy(
  () => import("./client/Settlement/ExposureSelection.tsx")
);

// const MTMCalculator = lazy(
//   () => import("./client/MTMCalculator/MTMCalculator.tsx")
// );
// const MTMRateInput = lazy(
//   () => import("./client/MTMRateInput/MTMRateInput.tsx")
// );
// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <NotificationProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PreloaderAnimation />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes */}
              <Route path="/hedging-dashboard" element={<NetExposure />} />

              {/* <Route path="/fxbooking" element={<FXForwardBookingForm />} /> */}
              <Route path="/linking-screen" element={<LinkingScreen />} />
              <Route path="/new-dashboard" element={<NewDashboard />} />
              {/* <Route path="/exposure-selection" element={<ExposureSelection />} /> */}
              <Route path="/fx-confirmation" element={<FxConfirmationPage />} />
              <Route path="/fxbooking" element={<FxForward />} />
              <Route path="/fx-cancellation" element={<FxCancellation />} />
              <Route path="/fx-wizard" element={<FxWizard />} />
              <Route path="/fx-output" element={<OutputTabs />} />
              <Route path="/mtm-upload" element={<MTMUploader />} />
              <Route path="/mtm-calculator" element={<MTMCalculator />} />
              <Route path="/mtm-rate-input" element={<MTMRateInput />} />
              {/* <Route path="/mtm-uploader" element={<MTMUploader />} /> */}
              <Route path="/reports" element={<Reports />} />
              <Route path="/ops-dashboard" element={<OPSDashboard />} />
              <Route path="/cfo-dashboard" element={<CFODashboard />} />
              <Route path="/user" element={<Users />} />
              <Route path="/user/create" element={<UserCreationForm />} />
              <Route path="/role" element={<Roles />} />
              <Route path="/entity" element={<Entity />} />
              <Route path="/hierarchical" element={<Hierarchical />} />
              <Route path="/role/create" element={<RoleCreation />} />
              <Route path="/permission" element={<Permission />} />
              <Route
                path="/cfo-dashboard-builder"
                element={<CFODashboardBuilder />}
              />
              <Route path="/exposure-upload" element={<ExposureUpload />} />
              <Route
                path="/exposure-bucketing"
                element={<ExposureBucketing />}
              />
              <Route path="/hedging-proposal" element={<Hedgingproposal />} />
              <Route path="/settlement" element={<PaymentRollover />} />
              <Route
                path="/exposure-selection"
                element={<ExposureSelection />}
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </NotificationProvider>
  );
}

export default App;
