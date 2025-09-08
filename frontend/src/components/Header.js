import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="site-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="site-title">Inkwell</h1>
          <span className="site-subtitle">Item management</span>
        </div>
        <div className="header-right">
          <button className="header-btn header-btn-primary">Help</button>
        </div>
      </div>
    </header>
  );
};

export default Header;