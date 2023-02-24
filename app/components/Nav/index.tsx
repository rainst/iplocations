import { Link } from "@remix-run/react";
import React from "react";

const Nav = () => {
  return (
    <div id="site-header">
      <h1>IP Locations</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/map">Map</Link>
      </nav>
    </div>
  );
};

export default Nav;
