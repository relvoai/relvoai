# Contacts API Contract

## Base URL
`/api/v1/admin`

## Endpoints

### 1. List Contacts
- **Method:** `GET`
- **Path:** `/contacts`
- **Query Parameters:**
    - `page` (integer, optional): Page number (default: 1).
    - `search` (string, optional): Filter by name, email, or phone.
- **Response:** `200 OK`
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "1234567890",
          "avatar_url": "https://...",
          "custom_attributes": { "key": "value" },
          "tags": ["vip"],
          "created_at": "2024-01-01T00:00:00.000000Z",
          "updated_at": "2024-01-01T00:00:00.000000Z"
        }
      ],
      "meta": {
          "current_page": 1,
          "from": 1,
          "last_page": 1,
          "links": [...],
          "path": "...",
          "per_page": 20,
          "to": 1,
          "total": 1
      }
    }
    ```

### 2. Create Contact
- **Method:** `POST`
- **Path:** `/contacts`
- **Request Body:**
    ```json
    {
      "name": "John Doe", // required, max:255
      "email": "john@example.com", // optional, unique, email, max:255
      "phone": "1234567890", // optional, max:20
      "avatar_url": "https://...", // optional, url, max:255
      "custom_attributes": { "company": "Acme Inc" }, // optional, array/object
      "tags": ["vip", "lead"] // optional, array of strings
    }
    ```
- **Response:** `201 Created`
    ```json
    {
      "success": true,
      "data": {
          "id": "uuid",
          "name": "John Doe",
          ...
      },
      "message": "Contact created successfully."
    }
    ```

### 3. Show Contact
- **Method:** `GET`
- **Path:** `/contacts/{uuid}`
- **Response:** `200 OK`
    ```json
    {
      "success": true,
      "data": {
          "id": "uuid",
          "name": "John Doe",
          ...
      }
    }
    ```

### 4. Update Contact
- **Method:** `PUT` or `PATCH`
- **Path:** `/contacts/{uuid}`
- **Request Body:**
    - Same fields as Create, but all are optional.
    - `email`: Validation ignores the current contact for uniqueness check.
- **Response:** `200 OK`
    ```json
    {
      "success": true,
      "data": {
          "id": "uuid",
          "name": "John Doe",
          ...
      },
      "message": "Contact updated successfully."
    }
    ```

### 5. Delete Contact
- **Method:** `DELETE`
- **Path:** `/contacts/{uuid}`
- **Response:** `200 OK`
    ```json
    {
      "success": true,
      "data": null,
      "message": "Contact deleted successfully."
    }
    ```

### 6. List Contact Conversations (History)
- **Method:** `GET`
- **Path:** `/contacts/{uuid}/conversations`
- **Query Parameters:**
    - `page` (integer, optional): Page number.
- **Response:** `200 OK`
    - Returns a list of `ConversationResource` objects.

### 7. List Contact Notes
- **Method:** `GET`
- **Path:** `/contacts/{uuid}/notes`
- **Query Parameters:**
    - `page` (integer, optional): Page number.
- **Response:** `200 OK`
    - Returns a list of `NoteResource` objects using `data` envelope.

### 8. Create Contact Note
- **Method:** `POST`
- **Path:** `/contacts/{uuid}/notes`
- **Request Body:**
    ```json
    {
      "content": "Customer is asking for a discount." // required, string, max:5000
    }
    ```
- **Response:** `201 Created`
    - Returns the created `Note`.

### 9. Merge Contact
- **Method:** `POST`
- **Path:** `/contacts/{uuid}/merge`
- **Request Body:**
    ```json
    {
      "target_contact_id": "target-uuid" // required, uuid, exists, different
    }
    ```
- **Response:** `200 OK`
    - Returns the target contact (the survivor).
    - Source contact is soft-deleted.
    - All conversations and notes are moved to target.
