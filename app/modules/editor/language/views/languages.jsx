import React from 'react';
import Origin from 'core/origin';

export default function AppHeader (props) {

const {
  _defaultLanguage,
  _languages
} = props;

return (
  <>
    <button className="btn add">Add</button>
    <div>
      {_languages.map(i=>
        <div data-lang={i}>
          <span>{i}</span>
          <button className="btn remove">Remove</button>
        </div>
      )}
    </div>
  </>
)}