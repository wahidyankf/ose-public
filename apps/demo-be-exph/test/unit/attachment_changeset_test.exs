defmodule DemoBeExph.AttachmentChangesetTest do
  use ExUnit.Case, async: true

  alias DemoBeExph.Attachment.Attachment

  @moduletag :unit

  describe "max_size_bytes/0" do
    test "returns the configured maximum file size" do
      assert Attachment.max_size_bytes() == 5 * 1024 * 1024
    end
  end

  describe "changeset/2 file size validation" do
    test "rejects files exceeding maximum size" do
      attrs = %{
        expense_id: 1,
        filename: "big.jpg",
        content_type: "image/jpeg",
        size: 6 * 1024 * 1024,
        data: "fake"
      }

      changeset = Attachment.changeset(%Attachment{}, attrs)
      refute changeset.valid?
      assert changeset.errors[:file] != nil
    end
  end
end
