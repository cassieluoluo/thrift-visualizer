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
import { Monaco } from "@monaco-editor/react";
import { editor as MonacoEditor } from "monaco-editor";
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
  const [parsedValue, setParsedValue] = useState([]);

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const onEditorMount = (
    editor: MonacoEditor.IStandaloneCodeEditor,
    _monaco: Monaco
  ) => {
    editorRef.current = editor;
  };

  const onSumbitClick = async () => {
    const editorValue = editorRef.current?.getValue();
    if (editorValue == null) {
      console.log("Editor value is null");
      return;
    }
    console.log("editor value length = ", editorValue?.length);
    try {
      const response = await (
        await fetch("/parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: editorValue,
          }),
        })
      ).json();
      setParsedValue(response);
      console.log("response", response);
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  const data = buildGraph(parsedValue);
  const ref = useRef<HTMLDivElement>(null);
  const networkOptions: Options = {
    manipulation: false,
    layout: {
      hierarchical: {
        enabled: true,
        levelSeparation: 200,
        direction: "UD",
      },
    },
    physics: {
      hierarchicalRepulsion: {
        nodeDistance: 300,
      },
    },
  };
  useLayoutEffect(() => {
    if (ref.current) {
      const instance = new Network(ref.current, data, networkOptions);
      // setNetwork(instance);
    }
    // return () => network?.destroy();
  }, [data]);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "row", alignContent: "flex-start" }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Editor
          width="800px"
          height="90vh"
          defaultLanguage="thrift"
          defaultValue={demoCode}
          onMount={onEditorMount}
        />
        <button onClick={onSumbitClick}>submit</button>
      </Box>
      <Box sx={{ flxeGrow: 2 }}>
        <div
          style={{
            height: 1000,
            width: 1800,
            borderColor: "black",
            borderWidth: 2,
          }}
          ref={ref}
        />
      </Box>
    </Box>
  );
}
// TODO it seems that union is not properly handled
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
      const children = statment.fields;
      for (let i in children) {
        const child = children[i];
        const childName =
          child.fieldType.type === "Identifier"
            ? child.fieldType.value
            : child.name.value;
        const childInfo = nodeInfo.get(childName);
        if (childInfo == null) {
          nodeInfo.set(childName, {
            id: index,
            type: children[i].fieldType.type,
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
  while (queue.length) {
    const key = queue.shift();
    const node = nodeInfo.get(key);
    const children = map.get(key);
    nodes.push({ id: node.id, label: key, shape: "box" });
    for (let i in children) {
      const child = nodeInfo.get(children[i]);
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
        queue.push(children[i]);
      }
    }
  }
  return { nodes, edges };
};

export default ThriftVisualizer;
