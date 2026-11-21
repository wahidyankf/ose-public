import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../../../../src/primitives/table/table";

describe("Table scenarios", () => {
  // @scenario specs/libs/web-ui/behaviours/table/table.feature: A table exposes header, body, rows, cells, and caption as table semantics
  it("exposes header, body, rows, cells, and caption as table semantics", () => {
    render(
      <Table>
        <TableCaption>Invoices</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>INV-001</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = screen.getByRole("table");

    expect(within(table).getByText("Invoices").tagName).toBe("CAPTION");
    expect(screen.getByRole("columnheader", { name: "Invoice" })).toBeTruthy();
    const bodyRows = within(table)
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") !== null);
    expect(bodyRows).toHaveLength(1);
    expect(within(bodyRows[0]).getByRole("cell", { name: "INV-001" })).toBeTruthy();
  });
});
