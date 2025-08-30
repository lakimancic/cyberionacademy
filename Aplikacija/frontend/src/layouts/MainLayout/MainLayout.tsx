import { Outlet } from "react-router-dom";
import Header from "@/components/Header/Header";
import "./MainLayout.css";
import LeftMenu from "@/components/LeftMenu/LeftMenu";

function MainLayout() {
  return (
    <main className="layout">
      <Header />
      <div className="layout-container">
        <LeftMenu />
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </main>
  );
}

export default MainLayout;
