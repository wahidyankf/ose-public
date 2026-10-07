"""The failure value a fallible FERRET function returns: a result whose ``Err`` carries one closed ``FerretError``."""

from typekit import Err

from ferret.domain.errors import FerretError, FerretResult


def refuse_the_arguments() -> FerretResult[int]:
    return Err(FerretError("ferret.args.invalid"))


def test_an_err_carries_the_exit_status_and_the_fixed_message_of_its_code() -> None:
    result = refuse_the_arguments()

    assert isinstance(result, Err)
    assert (result.error.code, result.error.exit_code, result.error.message) == (
        "ferret.args.invalid",
        2,
        "unrecognized or incomplete arguments",
    )
