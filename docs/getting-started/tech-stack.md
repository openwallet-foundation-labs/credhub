# Tech Stack

Typescript as programming language: large community and good support for wallet related libraries. Of course it does not perform as good as Rust, but it's easier to write and maintain for the current state of the project. It is possible to write different parts of the project in Rust or any other language later on.

Angular as frontend framework: All frontend applications are written in Angular. There was no intention to build a react native application so far, but it is possible to do so. Since the client is primarily job is to render information and not to execute business actions, other clients like a react native app, vanilla js or even a flutter app can be implemented.

Nestjs as backend framework: Nestjs is one of the popular frameworks for nodejs. The build in database connection, the openAPI support and the easy validation of incoming requests are the main reasons to use it. It is also possible to write the backend in Rust or any other language later on.

NX as monorepo manager: NX is a great tool to manage a monorepo. It is possible to share code between the applications and to define the jobs for building, testing and linting in one place. It is also possible to define the dependencies between the applications and to run the jobs in the right order.
