import React, { useEffect, useRef, useState } from 'react';
import Origin from 'core/origin';
import styled from "@emotion/styled";
import { Tree, TreeNode } from 'react-organizational-chart';

const StyledNode = styled.div`
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border: 1px solid red;
`;

export default function CourseMap ({courseMapWindow, history, diff, logDiff}) {

if (!history.length) {
  return (
    <h1>Please open a course to see the course map!</h1>
  )
}

const [historyIndex, setHistoryIndex] = useState(0);
const [snapshot, setSnapshot] = useState(history[historyIndex]);


const courseId = snapshot.at(0).attributes._courseId;
const courseNode = snapshot.findWhere({_id:courseId});
const children = getChildren(snapshot, courseId)

const backwards = () => {
  if (historyIndex <= 0) return;
  setHistoryIndex(prev => {
    const newIndex = prev - 1
    setSnapshot(history[newIndex]);
    return newIndex;
  })

  logIterationDiff(-1)
}

const forwards = () => {
  if (historyIndex >= history.length - 1) return;
  setHistoryIndex(prev => {
    const newIndex = prev + 1
    setSnapshot(history[newIndex]);
    return newIndex;
  })

  logIterationDiff(1)
}

const logIterationDiff = (dir) => {
  const left = history[historyIndex];
  const right = history[historyIndex+dir];
  const { added, removed, changed } = diff(left, right)

  courseMapWindow.console.log(`diffing iteration ${historyIndex+1} to ${historyIndex+1+dir}`);

  logDiff(left, added, removed, changed, courseMapWindow)
}

const keyHandler = (e) => {
  if (e.keyCode === 37 || e.keyCode === 39) {
    e.preventDefault();
  }
  if (e.keyCode === 37) return backwards();
  if (e.keyCode === 39) return forwards();
}

useEventListener('keyup', keyHandler, courseMapWindow);

return (
  <div className="courseMap">
    <div style={{fontSize:'2em'}}>Showing iteration{historyIndex+1}/{history.length}</div>
    <button className="action-primary" onClick={backwards}>Back</button>
    <button className="action-primary" onClick={forwards}>Forward</button>
    <div>(or use arrow keys)</div>
    <Tree
      lineWidth={'2px'}
      lineColor={'green'}
      lineBorderRadius={'10px'}
      label={<StyledNode>{getTitle(courseNode)}</StyledNode>}
    >
      {children.map(child =>
        <Stack key={child.get('_id')} id={child.get('_id')} snapshot={snapshot}></Stack>
      )}
    </Tree>
  </div>
)}

const Stack = ({id, snapshot}) => {
  const child = snapshot.findWhere({_id:id});
  let children = getChildren(snapshot, id)
  const isPage = child.get('_type') === 'page';
  if (isPage) {
    let children = getPageDescendantsStacked(snapshot, child);
    return (
      <TreeNode label={<StyledNode>{getTitle(child)}</StyledNode>}>
        <StackItem children={children} snapshot={snapshot} />
      </TreeNode>
    )
  }
  return (
    <TreeNode label={<StyledNode>{getTitle(child)}</StyledNode>}>
      {children.map(child =>
        <Stack key={child.get('_id')} id={child.get('_id')} snapshot={snapshot}></Stack>
      )}
    </TreeNode>
  )
}

const StackItem = ({snapshot, children}) => {
  if (children.length === 0) return null;

  const first = children.shift();

  if (first.get('_type') === 'article') {
    if (children.length === 0) {
      return <TreeNode label={<StyledNode style={{borderColor:'blue'}}>ARTICLE</StyledNode>}/>
    }
    return (
      <TreeNode label={<StyledNode style={{borderColor:'blue'}}>ARTICLE</StyledNode>}>
        <StackItem children={children} snapshot={snapshot}/>
      </TreeNode>
    )
  }

  const components = getChildren(snapshot, first.get('_id'));
  let com1 = components[0];
  let com2 = components[1];

  if (com2 && com2.get('_layout') === 'left') {
    const temp = com2;
    com2 = com1;
    com1 = temp;
  }

  const foo = () => {
    return (
      <StyledNode>
      {getTitle(first)}<br/>
      {!com1 &&
        <em>empty block</em>
      }
      {com1 && !com2 &&
        getTitle(com1)
      }
      {com1 && com2 && 
        getTitle(com1)+' | '+getTitle(com2)
      }
    </StyledNode>
    )
  }

  if (children.length === 0) {
    return (
      <TreeNode label={foo()}/>
    )
  }

  return (
    <TreeNode label={foo()}>
      <StackItem children={children} snapshot={snapshot} />
    </TreeNode>
  )
}

const Child = (props) => {
  const {
    id
  } = props;
  const child = Origin.editor.data.content.findWhere({_id:id});
  const children = getChildren(id)
  const willStack = shouldStackChildren(child);
  if (willStack) {
    return (
      <TreeNode label={<StyledNode>{/* getTitle(first) ||  */child.get('_type')}</StyledNode>}>
        <RecursiveChild children={children} />
      </TreeNode>
    )
  }
  return (
    <TreeNode label={<StyledNode>{getTitle(child)}</StyledNode>}>
      {children.map(child =>
        <Child key={child.get('_id')} id={child.get('_id')}></Child>
      )}
    </TreeNode>
  )
}

const RecursiveChild = ({children}) => {
  if (children.length === 0) return null;

  const first = children.shift();
  const components = getChildren(first.get('_id'));
  let com1 = components[0];
  let com2 = components[1];

  if (com2 && com2.get('_layout') === 'left') {
    const temp = com2;
    com2 = com1;
    com1 = temp;
  }

  if (children.length === 0) {
    
    return (
      <>
      {!com1 &&
        <TreeNode label={<StyledNode>{getTitle(first)}</StyledNode>}></TreeNode>
      }
      {com1 && !com2 &&
        <TreeNode label={<StyledNode>{getTitle(first)}<br/>{getTitle(com1)}</StyledNode>}></TreeNode>
      }
      {com1 && com2 && 
        <TreeNode label={<StyledNode>{getTitle(first)}<br/>{getTitle(com1)} | {getTitle(com2)}</StyledNode>}></TreeNode>
      }
      </>
    )
  }
  return (
    <TreeNode label={<StyledNode>
      {!com1 &&
        getTitle(first)
      }
      {com1 && !com2 &&
        getTitle(first)+'<br/>'+getTitle(com1)
      }
      {com1 && com2 && 
        getTitle(first)+'<br/>'+getTitle(com1)+' | '+getTitle(com2)
      }
    </StyledNode>}>
      <RecursiveChild children={children} />
    </TreeNode>
  )
}

function getTitle(model) {
  if (model.get('displayTitle') && model.get('displayTitle') !== 'Untitled') return model.get('displayTitle');
  if (model.get('title') && model.get('title') !== 'Untitled') return model.get('title');
  return model.get('_type')
}

function shouldStackChildren(model) {
  const typeHierarchy = ['course', 'menu', 'page', 'article', 'block', 'component'];
  return typeHierarchy.indexOf(model.get('_type')) >= 3;
}

function getChildren(snapshot, id) {
  return snapshot.where({ _parentId: id }).sort((a,b) => {
    return a._sortOrder < b._sortOrder ? 1 : -1;
  });
}

function getPageDescendantsStacked(snapshot, page) {
  return getChildren(snapshot, page.get('_id')).reduce((flattened, article) => {
    const blocks = getChildren(snapshot, article.get('_id'));
    return flattened.concat(article, blocks);
  }, [])
}

function useEventListener(eventName, handler, element = window){
  // Create a ref that stores handler
  const savedHandler = useRef();

  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler ...
  // ... without us needing to pass it in effect deps array ...
  // ... and potentially cause effect to re-run every render.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      // Make sure element supports addEventListener
      // On 
      const isSupported = element && element.addEventListener;
      if (!isSupported) return;

      // Create event listener that calls handler function stored in ref
      const eventListener = event => savedHandler.current(event);

      // Add event listener
      element.addEventListener(eventName, eventListener);

      // Remove event listener on cleanup
      return () => {
        element.removeEventListener(eventName, eventListener);
      };
    },
    [eventName, element] // Re-run if eventName or element changes
  );
};