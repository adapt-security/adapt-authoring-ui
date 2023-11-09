import React from 'react';
import Origin from 'core/origin';

export default function Languages (props) {

const {
  _defaultLanguage,
  _languages,
  onAddClicked,
  onRemoveClicked,
  onSetDefaultClicked
} = props;

return (
  <>
    <button className="btn add" onClick={onAddClicked}>Add</button>
    <table>
      <tr>
        <th>Language</th>
        <th colspan="2">Actions</th>
      </tr>
      {_languages.map(i=>
        <tr data-lang={i} key={i}>
          {i === _defaultLanguage &&
            <>
              <td>{i}</td>
              <td colspan="2">(default Language)</td>
            </>
          }
          {i !== _defaultLanguage &&
            <>
              <td>{i}</td>
              <td><button className="btn remove" onClick={onRemoveClicked}>Remove</button></td>
              <td><button className="btn set-default" onClick={onSetDefaultClicked}>Set as default</button></td>
            </>
          }
        </tr>
      )}
    </table>
  </>
)}