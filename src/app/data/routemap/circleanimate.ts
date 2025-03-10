import React from 'react';

export type CircleAnimate = {
    ref: React.MutableRefObject<Array<HTMLDivElement>>,
    index: number,
    chipColor: string,
}