import React from "react";
import ExposesComponet from "{{ &exposesEntryOriginPath }}";

const CssScopeWrapper = (props) => {
  return (
    <div {{&prefix}}>
      <ExposesComponet {...props} />
    </div>
  );
};

export default CssScopeWrapper;