import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import FilesPage from "@/pages/files";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<FilesPage />} path="/files" />
    </Routes>
  );
}

export default App;
