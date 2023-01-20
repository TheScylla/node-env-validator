# node-env-validator
node-env-validator npm package


## Example

```
PORT=1234
USERNAME=my-username
NOT_AN_URI=HELLO
```

```ts

const config = {
  port: portValidation('PORT'),
  username: stringValidation('USERNAME'),
  notAnUri: uriValidation('NOT_AN_URI'), // Will throw an error
};


```