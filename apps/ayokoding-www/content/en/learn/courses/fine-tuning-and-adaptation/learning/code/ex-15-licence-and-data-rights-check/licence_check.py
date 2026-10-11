# learning/code/ex-15-licence-and-data-rights-check/licence_check.py
"""Worked Example 15: Licence and Data-Rights Check."""  # => co-31: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from dataclasses import dataclass  # => co-31: two independent rights checks -- worth a typed record, not two loose booleans


@dataclass(frozen=True)  # => co-31: frozen -- a rights-check record should not mutate after the fact
class RightsCheck:  # => co-31: co-31's two independent checks -- base-model licence AND training-data rights
    base_model_licence: str  # => co-31: the base checkpoint's actual licence, taken from its model card
    licence_permits_commercial_finetune: bool  # => co-31: does that licence allow a fine-tuned DERIVATIVE in a commercial product?
    training_data_source: str  # => co-31: where the training examples actually came from
    data_rights_permit_training: bool  # => co-31: does Vantage actually hold the right to train on this data?


CANDIDATE_CHECK = RightsCheck(  # => co-31: the vocabulary-adapter project's own rights check, run BEFORE any training
    base_model_licence="Apache 2.0",  # => co-31: `Qwen/Qwen2.5-0.5B-Instruct`'s Apache 2.0 licence per its model card -- see this course's References
    licence_permits_commercial_finetune=True,  # => co-31: Apache 2.0 permits commercial derivative use, including fine-tuning
    training_data_source="Vantage's own historical support tickets (internal, first-party)",  # => co-31: first-party data
    data_rights_permit_training=True,  # => co-31: Vantage's own Terms of Service reserve the right to use ticket data for product improvement
)  # => co-31: closes CANDIDATE_CHECK

REJECTED_ALTERNATIVE_CHECK = RightsCheck(  # => co-31: a rejected candidate base model, kept here as the contrasting failure case
    base_model_licence="Custom, non-commercial research licence",  # => co-31: illustrative -- some base models ship under exactly this kind of licence
    licence_permits_commercial_finetune=False,  # => co-31: a non-commercial licence blocks Vantage's for-profit product use outright
    training_data_source="Vantage's own historical support tickets (internal, first-party)",  # => co-31: same data, different base model
    data_rights_permit_training=True,  # => co-31: the data side is fine here -- the licence side is what fails
)  # => co-31: closes REJECTED_ALTERNATIVE_CHECK


def rights_check_passes(check: RightsCheck) -> tuple[bool, str]:  # => co-31: the actual gate -- BOTH independent checks must hold
    """Pass iff the base model's licence permits a commercial fine-tune AND the training data's rights permit training."""  # => co-31: documents rights_check_passes's contract -- no runtime output, just sets its __doc__
    if not check.licence_permits_commercial_finetune:  # => co-31: licence check fails first, if it fails at all
        return False, f"BLOCKED: {check.base_model_licence!r} does not permit a commercial fine-tune"  # => co-31
    if not check.data_rights_permit_training:  # => co-31: data-rights check
        return False, f"BLOCKED: rights over {check.training_data_source!r} do not permit training"  # => co-31
    return True, "CLEARED: base-model licence and training-data rights both permit this fine-tune"  # => co-31


if __name__ == "__main__":  # => co-31: entry point -- runs only when this file executes directly, not on import
    passed, reason = rights_check_passes(CANDIDATE_CHECK)  # => co-31: run the check BEFORE training begins
    print(f"Candidate base model: {passed} -- {reason}")  # => co-31
    assert passed, "the actual candidate (Apache 2.0, first-party data) must clear this check"  # => co-31
    rejected_passed, rejected_reason = rights_check_passes(REJECTED_ALTERNATIVE_CHECK)  # => co-31: run the SAME check on the rejected alternative
    print(f"Rejected alternative base model: {rejected_passed} -- {rejected_reason}")  # => co-31
    assert not rejected_passed, "a non-commercial-licensed base model must be blocked before any training starts"  # => co-31
    print("MATCH: the rights check runs and blocks BEFORE training -- never discovered after the fact")  # => co-31
    # => co-31: this check is step 1 of the capstone's decision phase -- a cleared licence is a precondition, not an afterthought
