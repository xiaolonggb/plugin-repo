import React from "react";
import ExposesComponet from "{{ &exposesEntryOriginPath }}";

const CssScopeWrapper = (props) => {
  return (
    <ExposesComponet {...props} cssScopePrefix={{&prefix}} />
  );
};

export default CssScopeWrapper;