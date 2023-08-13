import express, { Response } from "express";
import * as path from "path";
import {
  parse,
  ThriftDocument,
  ThriftErrors,
  ThriftStatement,
} from "@creditkarma/thrift-parser";

const app: express.Application = express();
app.use(express.json());
app.post("/parse", async (request, response) => {
  const data = request.body.data;
  try {
    const thriftAST: ThriftDocument | ThriftErrors = parse(data);
    switch (thriftAST.type) {
      case "ThriftDocument":
        response.json(thriftAST.body);
        console.log(thriftAST.body);
        return;
      case "ThriftErrors":
        response.sendStatus(500);
        return;
    }
  } catch (error) {
    console.log(error);
    response.sendStatus(404);
    return;
  }
});

// const parseData = (data: ThriftStatement[]) => {
//     data.forEach()
// };
app.listen(3001, () => {
  console.log("Serving at port 3001");
});
