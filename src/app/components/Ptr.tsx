import PullToRefresh from 'react-simple-pull-to-refresh';
import React from 'react';
import Refreshing from './refreshing-content'
import App from '../../App';
const dark = true;

export const Ptr = () => {
  let color = "white";
  if(dark){
    color = "black";
  }
  const handleRefresh = (): Promise<React.FC> => {
    return new Promise(res => {
      location.reload();
    });
  };
  return (
    <PullToRefresh 
    onRefresh={handleRefresh}
    backgroundColor={color}
    refreshingContent={<Refreshing mode = {dark} />}>
    <div>
      <App/>
    </div>
    </PullToRefresh>
  );
}