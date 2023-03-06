import { Link } from "@remix-run/react";
import React from "react";

const Nav = () => {
  return (
    <div id="site-header">
      <h1>
        <Link to="/">IP Locations</Link>
      </h1>
    </div>
  );
};

export default Nav;
