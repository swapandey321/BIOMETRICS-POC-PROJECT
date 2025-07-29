# fido-plugin-poc

Implement webauthn for capacitor

## Install

```bash
npm install fido-plugin-poc
npx cap sync
```

## API

<docgen-index>

* [`echo(...)`](#echo)
* [`register(...)`](#register)
* [`authenticate(...)`](#authenticate)
* [`fetchSecureStorage()`](#fetchsecurestorage)
* [`isWebAuthnSupported()`](#iswebauthnsupported)
* [`secureStorage(...)`](#securestorage)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### echo(...)

```typescript
echo(options: { value: string; }) => Promise<{ value: string; }>
```

| Param         | Type                            |
| ------------- | ------------------------------- |
| **`options`** | <code>{ value: string; }</code> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### register(...)

```typescript
register(options: { credentialJson: any; }) => Promise<{ credentialJson: any; }>
```

| Param         | Type                                  |
| ------------- | ------------------------------------- |
| **`options`** | <code>{ credentialJson: any; }</code> |

**Returns:** <code>Promise&lt;{ credentialJson: any; }&gt;</code>

--------------------


### authenticate(...)

```typescript
authenticate(options: { publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions; }) => Promise<{ assertionJson: any; }>
```

| Param         | Type                                                     |
| ------------- | -------------------------------------------------------- |
| **`options`** | <code>{ publicKeyCredentialRequestOptions: any; }</code> |

**Returns:** <code>Promise&lt;{ assertionJson: any; }&gt;</code>

--------------------


### fetchSecureStorage()

```typescript
fetchSecureStorage() => Promise<{ response: any; }>
```

**Returns:** <code>Promise&lt;{ response: any; }&gt;</code>

--------------------


### isWebAuthnSupported()

```typescript
isWebAuthnSupported() => Promise<{ response: any; }>
```

**Returns:** <code>Promise&lt;{ response: any; }&gt;</code>

--------------------


### secureStorage(...)

```typescript
secureStorage(options: { verificationJson: any; }) => Promise<{ response: any; }>
```

| Param         | Type                                    |
| ------------- | --------------------------------------- |
| **`options`** | <code>{ verificationJson: any; }</code> |

**Returns:** <code>Promise&lt;{ response: any; }&gt;</code>

--------------------

</docgen-api>
