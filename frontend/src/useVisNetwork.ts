import { useState, useLayoutEffect, useRef } from "react";
import {
  Network,
  Options,
  Data,
  Edge,
  Node,
} from "vis-network/standalone/esm/vis-network";

export interface UseVisNetworkOptions {
  options: Options;
  nodes: Node[];
  edges: Edge[];
}
const useVisNetwork = (props: UseVisNetworkOptions) => {
  const { edges, nodes, options } = props;

  const [network, setNetwork] = useState<Network | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const data: Data = { nodes, edges };

  useLayoutEffect(() => {
    if (ref.current) {
      console.log("hit", ref.current, data);
      const instance = new Network(ref.current, data, options);
      setNetwork(instance);
    }
    return () => network?.destroy();
  }, []);

  return {
    network,
    ref,
  };
};
export default useVisNetwork;
