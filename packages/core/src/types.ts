import ts from "typescript";

export type AutoTestFuncInfo = {
    name: string | ts.__String;
    code: string;
    path: string;
    absolutePath: string;
}