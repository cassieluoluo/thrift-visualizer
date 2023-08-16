import {
  EnumDefinition,
  EnumMember,
  FieldDefinition,
  StructDefinition,
  ThriftStatement,
  UnionDefinition,
} from '@creditkarma/thrift-parser';
import {
  Data as VisGraphData,
  Node as GraphNode,
  Edge as GraphEdge,
} from 'vis-network/standalone/esm/vis-network';

const PrimitiveTypes = new Set(['I32Keyword', 'StringKeyword']);

export function buildGraph(ast: Array<ThriftStatement>): VisGraphData {
  const nodes: Array<GraphNode> = [];
  const edges: Array<GraphEdge> = [];

  const processStructOrUnionFields = (
    structOrUnion: StructDefinition | UnionDefinition
  ) => {
    const structName = structOrUnion.name.value;
    const graphNode: GraphNode = {
      id: structName,
      label: structName,
      shape: 'box',
    };
    nodes.push(graphNode);
    structOrUnion.fields.forEach((field) => {
      const fieldName = field.name.value;
      const fieldNodeId = `${structName}:${fieldName}`;
      const graphNode: GraphNode = {
        id: fieldNodeId,
        label: fieldName,
        shape: 'box',
        color: 'SandyBrown',
      };
      nodes.push(graphNode);
      edges.push({
        from: structName,
        to: fieldNodeId,
        arrows: { to: true },
        color: 'RoyalBlue',
        dashes: field.requiredness === 'optional',
      });

      if (field.fieldType.type === 'Identifier') {
        edges.push({
          from: fieldNodeId,
          to: field.fieldType.value,
          arrows: { to: true },
          color: 'RoyalBlue',
        });
      }
    });
  };

  const processEnum = (enumStatement: EnumDefinition) => {
    const enumName = enumStatement.name.value;
    const graphNode: GraphNode = {
      id: enumName,
      label: enumName,
      shape: 'box',
      color: 'Plum',
    };
    nodes.push(graphNode);
    enumStatement.members.forEach((member) => {
      const memberName = member.name.value;
      const memberId = `${enumName}:${memberName}`;
      const graphNode: GraphNode = {
        id: memberId,
        label: memberName,
        shape: 'box',
        color: 'LightSteelBlue',
      };
      nodes.push(graphNode);
      edges.push({
        from: enumName,
        to: memberId,
        arrows: { to: true },
        color: 'RoyalBlue',
      });
    });
  };

  ast.forEach((statement) => {
    switch (statement.type) {
      case 'StructDefinition':
      case 'UnionDefinition':
        processStructOrUnionFields(statement);
        break;
      case 'EnumDefinition':
        processEnum(statement);
        break;
      default:
      // console.log(`Uninteresting statement ${statement.type}`);
    }
  });
  return { nodes, edges };
}
