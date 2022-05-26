import React, { FC } from 'react'

type props = {
    title: string;
};

const Card: FC<props> = ({title}) =>  {

    return (
        <div className="Card">
            <h1>title: { title }</h1>
        </div>
    );
};

export default Card;