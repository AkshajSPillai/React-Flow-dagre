/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  removeElements,
  isNode
} from "react-flow-renderer";
import dagre from "dagre";
import html2canvas from "html2canvas";

import initialElements from "./initial-elements";

import "./layouting.css";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// In order to keep this example simple the node width and height are hardcoded.
// In a real world app you would use the correct width and height values of
// const nodes = useStoreState(state => state.nodes) and then node.__rf.width, node.__rf.height

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (elements, direction = "LR") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  elements.forEach((el) => {
    if (isNode(el)) {
      dagreGraph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
    } else {
      dagreGraph.setEdge(el.source, el.target);
    }
  });

  dagre.layout(dagreGraph);

  return elements.map((el) => {
    if (isNode(el)) {
      const nodeWithPosition = dagreGraph.node(el.id);
      el.targetPosition = isHorizontal ? "left" : "top";
      el.sourcePosition = isHorizontal ? "right" : "bottom";

      // unfortunately we need this little hack to pass a slightly different position
      // to notify react flow about the change. Moreover we are shifting the dagre node position
      // (anchor=center center) to the top left so it matches the react flow node anchor point (top left).
      el.position = {
        x: nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000,
        y: nodeWithPosition.y - nodeHeight / 2
      };
    }

    return el;
  });
};

const layoutedElements = getLayoutedElements(initialElements);

const LayoutFlow = () => {
  const [elements, setElements] = useState(layoutedElements);
  const onConnect = (params) =>
    setElements((els) =>
      addEdge({ ...params, type: "smoothstep", animated: true }, els)
    );
  const onElementsRemove = (elementsToRemove) =>
    setElements((els) => removeElements(elementsToRemove, els));

  const [img, setImg] = useState();
  const onLayout = useCallback(
    (direction) => {
      const layoutedElements = getLayoutedElements(elements, direction);
      setElements(layoutedElements);
    },
    [elements]
  );
  const saveJpg = () => {
    console.log("generate img");
    const map = document.getElementById("map");

    if (map)
      html2canvas(map, {
        windowWidth: 2500,
        windowHeight: 1000
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        console.log(imgData);

        const tmpLink = document.createElement("a");
        tmpLink.download = "image.png"; // set the name of the download file
        tmpLink.href = imgData;

        setImg(imgData);
        // temporarily add link to body and initiate the download
        document.body.appendChild(tmpLink);
        tmpLink.click();
        document.body.removeChild(tmpLink);
      });
  };

  return (
    <div className="layoutflow">
      <ReactFlowProvider>
        <ReactFlow
          id="map"
          elements={elements}
          onConnect={onConnect}
          onElementsRemove={onElementsRemove}
          connectionLineType="smoothstep"
        />
        <div className="controls">
          <button onClick={() => onLayout("TB")}>vertical layout</button>
          <button onClick={() => onLayout("LR")}>horizontal layout</button>
        </div>
      </ReactFlowProvider>

      <button onClick={saveJpg}>save</button>

      <img src={img} />
    </div>
  );
};

export default LayoutFlow;
