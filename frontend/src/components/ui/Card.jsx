import React from "react";

const Card = ({ title, right, children }) => (
  <div className="card">
    {(title || right) && (
      <div className="card__header">
        {title && <h3 className="card__title">{title}</h3>}
        {right && <div className="card__right">{right}</div>}
      </div>
    )}
    <div className="card__body">{children}</div>
  </div>
);

export default Card;