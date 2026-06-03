## ADDED Requirements

### Requirement: User message event emission

The AgentSession SHALL emit a `user_message` event when a user prompt is submitted, before the `turn_start` event. This event SHALL contain the message content and any attached images.

#### Scenario: User message event emitted on prompt

- **WHEN** `session.prompt("hello")` is called
- **THEN** a `user_message` event is emitted with `{ type: "user_message", content: "hello" }`

#### Scenario: User message event with images

- **WHEN** `session.prompt("check this", { images: [{ data: "...", mimeType: "image/png" }] })` is called
- **THEN** a `user_message` event is emitted with the content and images array

### Requirement: User message event type definition

The `AgentSessionEvent` union type SHALL include a `user_message` variant with fields: `type`, `content`, and optional `images`.

#### Scenario: TypeScript compilation passes

- **WHEN** the events module is type-checked
- **THEN** the `user_message` variant is a valid member of `AgentSessionEvent`
