import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import TimerPage from "./pages/TimerPage";
import RecordPage from "./pages/RecordPage";
import ResultsPage from "./pages/ResultsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/timer",
    element: <TimerPage />,
  },
  {
    path: "/record",
    element: <RecordPage />,
  },
  {
    path: "/results",
    element: <ResultsPage />,
  },
]);