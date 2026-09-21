"""The canonical serialization every hash in the shared data contract is computed over."""

from typing import Any

import pytest

from ferret.domain.canonical import canonical_bytes


def test_only_the_mandatory_characters_are_escaped() -> None:
    text = '"\\\b\f\n\r\t\x00\x1f\x7f/é日\u2028'

    assert canonical_bytes(text) == (b'"\\"\\\\\\b\\f\\n\\r\\t\\u0000\\u001f\x7f/' + "é日\u2028".encode() + b'"')


def test_control_characters_without_a_short_escape_use_lowercase_four_digit_hex() -> None:
    assert canonical_bytes("\x0b\x1a\x1f") == b'"\\u000b\\u001a\\u001f"'


def test_properties_keep_the_callers_order_with_no_whitespace() -> None:
    assert canonical_bytes({"b": 1, "a": [True, None, 0, -3]}) == b'{"b":1,"a":[true,null,0,-3]}'


def test_integers_are_plain_base_ten_and_null_is_json_null() -> None:
    assert canonical_bytes({"n": 0, "m": 86_400_000, "x": None}) == b'{"n":0,"m":86400000,"x":null}'


@pytest.mark.parametrize(
    "value",
    [1.5, 2.0, float("nan"), float("inf"), [{"deep": [1.5]}], {"a": {"b": 0.1}}],
    ids=["float", "integral-float", "nan", "infinity", "float-in-list", "float-in-object"],
)
def test_a_floating_point_number_has_no_canonical_form(value: Any) -> None:
    with pytest.raises(TypeError):
        canonical_bytes(value)
