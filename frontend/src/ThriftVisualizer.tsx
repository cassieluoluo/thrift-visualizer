import { useState, useLayoutEffect, useRef } from "react";
import { ThriftStatement } from "@creditkarma/thrift-parser";
import {
  Network,
  Options,
  Data,
  Edge,
  Node,
} from "vis-network/standalone/esm/vis-network";
import Box from "@mui/material/Box";
import Editor from "@monaco-editor/react";

const demoCode = `namespace js test

const string test = 'test'

struct Foo {
	1: i32 id
    2: string name
}

struct MyStruct {
	1: optional string test
    2: list<string> bar
    3: Foo foo
}

service MyService {
	void ping()
}`;

function ThriftVisualizer() {
  const [value, setValue] = useState(demoCode);
  const [parsedValue, setParsedValue] = useState([]);
  const onSumbitClick = async () => {
    try {
      const response = await (
        await fetch("/parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: value,
          }),
        })
      ).json();
      // console.log(response);
      setParsedValue(response);
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  const data = buildGraph(parsedValue);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      console.log("hit", ref.current, data);
      const instance = new Network(ref.current, data, {});
      // setNetwork(instance);
    }
    // return () => network?.destroy();
  }, [data]);

  const editorRef = useRef(null);

  return (
    <Box sx={{ display: "flex", flexDirection: "row" }}>
      <Box sx={{ flexGrow: 2 }}>
        <Editor
          width="600px"
          height="90vh"
          defaultLanguage="thrift"
          defaultValue={demoCode}
        />
        <button onClick={onSumbitClick}>submit</button>
      </Box>
      <Box sx={{ flxeGrow: 1 }}>
        <div style={{ height: 700, width: "100%" }} ref={ref} />
      </Box>
    </Box>
  );
}

const buildGraph = (data: Array<ThriftStatement>) => {
  const map = new Map();
  const nodeInfo = new Map();
  let index = 0;
  data.forEach((statment: ThriftStatement) => {
    if (statment.type === "StructDefinition") {
      const key = statment.name.value;
      let value = map.get(key) ?? [];
      const info = nodeInfo.get(key);
      if (info == null) {
        nodeInfo.set(key, { id: index, type: statment.type, indegree: 0 });
        index++;
      } else {
        nodeInfo.set(key, { ...info, type: statment.type });
      }
      const childs = statment.fields;
      for (let i in childs) {
        const child = childs[i];
        const childName =
          child.fieldType.type === "Identifier"
            ? child.fieldType.value
            : child.name.value;
        const childInfo = nodeInfo.get(childName);
        if (childInfo == null) {
          nodeInfo.set(childName, {
            id: index,
            type: childs[i].fieldType.type,
            indegree: 1,
          });
          index++;
        } else {
          nodeInfo.set(childName, {
            ...childInfo,
            indegree: ++childInfo.indegree,
          });
        }
        value.push(childName);
      }

      map.set(key, value);
    }
  });

  const iterator = nodeInfo.entries();
  const queue = [];
  while (true) {
    const entry = iterator.next().value;
    if (entry == null) {
      break;
    }
    if (entry[1].indegree === 0) {
      queue.push(entry[0]);
    }
  }
  const nodes = [];
  const edges = [];
  const options = {
    layout: {
      hierarchical: {
        direction: "UD",
        sortMethod: "directed",
      },
    },
    edges: {
      arrows: "to",
    },
  };
  while (queue.length) {
    const key = queue.shift();
    const node = nodeInfo.get(key);
    const childs = map.get(key);
    nodes.push({ id: node.id, label: key });
    for (let i in childs) {
      const child = nodeInfo.get(childs[i]);
      edges.push({
        from: node.id,
        to: child.id,
        arrows: {
          to: {
            enabled: true,
            type: "arrow",
          },
        },
      });
      child.indegree -= 1;
      if (child.indegree === 0) {
        queue.push(childs[i]);
      }
    }
  }
  return { nodes, edges };
};

export default ThriftVisualizer;
