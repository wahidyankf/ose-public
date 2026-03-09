defmodule OrganicleverBeExphWeb.ErrorJSONTest do
  use OrganicleverBeExphWeb.ConnCase, async: true

  test "renders 404" do
    assert OrganicleverBeExphWeb.ErrorJSON.render("404.json", %{}) == %{errors: %{detail: "Not Found"}}
  end

  test "renders 500" do
    assert OrganicleverBeExphWeb.ErrorJSON.render("500.json", %{}) ==
             %{errors: %{detail: "Internal Server Error"}}
  end
end
