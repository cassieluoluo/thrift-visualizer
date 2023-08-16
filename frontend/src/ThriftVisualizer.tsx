import { useState, useLayoutEffect, useRef } from 'react';
import { ThriftStatement } from '@creditkarma/thrift-parser';
import { Network, Options } from 'vis-network/standalone/esm/vis-network';
import Box from '@mui/material/Box';
import Editor from '@monaco-editor/react';
import { Monaco } from '@monaco-editor/react';
import { editor as MonacoEditor } from 'monaco-editor';
import { buildGraph } from './ThriftGraphBuilder';

const demoCode = `namespace js test

const string test = 'test'

enum TestEnum {
  FOO = 1
  BAR = 2
}
struct Foo {
	1: i32 id
  2: string name
  3: bool bar
  4: TestEnum enumField
}

struct MyStruct {
	1: optional string test
  2: list<string> bar
  3: Foo foo
  4: string name
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
      console.log('Editor value is null');
      return;
    }
    console.log('editor value length = ', editorValue?.length);
    try {
      const response = await (
        await fetch('/parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: editorValue,
          }),
        })
      ).json();
      setParsedValue(response);
      console.log('response', response);
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
        direction: 'UD',
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
      sx={{ display: 'flex', flexDirection: 'row', alignContent: 'flex-start' }}
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
            height: 1800,
            width: 1200,
            borderColor: 'black',
            borderWidth: 2,
          }}
          ref={ref}
        />
      </Box>
    </Box>
  );
}

export default ThriftVisualizer;
