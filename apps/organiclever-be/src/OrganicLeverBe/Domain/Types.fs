module OrganicLeverBe.Domain.Types

type DomainError =
    | ValidationError of field: string * message: string
    | NotFound of entity: string
    | Unauthorized of message: string
    | Conflict of message: string
