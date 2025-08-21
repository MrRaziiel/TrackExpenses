import React from "react";

const Title = ({ text }) => {
  return (

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold py-2">
          {text}
        </h1>
      </div>

  );
};

export default Title;