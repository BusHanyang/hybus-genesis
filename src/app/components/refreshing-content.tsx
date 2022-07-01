import './refreshing-content.scss';

import React from 'react';

// Source: https://loading.io/css/

interface RefreshingContentProps{
  mode?: boolean;
}

const RefreshingContent:React.FC<RefreshingContentProps> = ({
  mode = false
}) => {
  if(mode){
    return (
      <div className="lds-ellipsis" data-theme="dark">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    );
  } else {
    return (
    
      <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    );
  }

};

export default RefreshingContent;