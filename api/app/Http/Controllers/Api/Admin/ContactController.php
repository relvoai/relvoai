<?php

namespace App\Http\Controllers\Api\Admin;

use App\Constants\Permissions;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\StoreContactRequest;
use App\Http\Requests\UpdateContactRequest;
use App\Http\Resources\AdminConversationResource;
use App\Http\Resources\ContactResource;
use App\Http\Resources\NoteResource;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;

class ContactController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:'.Permissions::CONTACTS_VIEW_ANY, only: ['index']),
            new Middleware('permission:'.Permissions::CONTACTS_VIEW, only: ['show']),
            new Middleware('permission:'.Permissions::CONTACTS_CREATE, only: ['store']),
            new Middleware('permission:'.Permissions::CONTACTS_UPDATE, only: ['update']),
            new Middleware('permission:'.Permissions::CONTACTS_DELETE, only: ['destroy']),
            new Middleware('permission:'.Permissions::CONTACTS_VIEW, only: ['conversations', 'notes']),
            new Middleware('permission:'.Permissions::CONTACTS_UPDATE, only: ['storeNote', 'merge']), // Assuming update permission for adding notes/merging
        ];
    }

    /**
     * List Contacts
     *
     * Get a paginated list of contacts.
     */
    public function index(Request $request)
    {
        $query = Contact::query();

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $this->success(ContactResource::collection($query->latest()->paginate(20)));
    }

    /**
     * Create Contact
     *
     * Create a new contact.
     */
    public function store(StoreContactRequest $request)
    {
        $contact = Contact::create($request->validated());

        return $this->success(new ContactResource($contact), 'Contact created successfully.', 201);
    }

    /**
     * Show Contact
     *
     * Get details of a specific contact.
     */
    public function show(Contact $contact)
    {
        return $this->success(new ContactResource($contact));
    }

    /**
     * Update Contact
     *
     * Update an existing contact's storage.
     */
    public function update(UpdateContactRequest $request, Contact $contact)
    {
        $contact->update($request->validated());

        return $this->success(new ContactResource($contact), 'Contact updated successfully.');
    }

    /**
     * Delete Contact
     *
     * Delete a specific contact.
     */
    public function destroy(Contact $contact)
    {
        $contact->delete();

        return $this->success(null, 'Contact deleted successfully.');
    }

    /**
     * List Contact Conversations
     *
     * Get a paginated list of conversations for this contact.
     */
    public function conversations(Contact $contact)
    {
        $conversations = $contact->conversations()
            ->with(['visitor', 'assignedTo'])
            ->latest('last_message_at')
            ->paginate(20);

        return $this->success(AdminConversationResource::collection($conversations));
    }

    /**
     * List Contact Notes
     *
     * Get a paginated list of notes for this contact.
     */
    public function notes(Contact $contact)
    {
        $notes = $contact->notes()
            ->with('user')
            ->latest()
            ->paginate(20);

        return $this->success(NoteResource::collection($notes));
    }

    /**
     * Create Contact Note
     *
     * Add a new internal note to the contact.
     */
    public function storeNote(Request $request, Contact $contact)
    {
        $request->validate([
            'content' => ['required', 'string', 'max:5000'],
        ]);

        $note = $contact->notes()->create([
            'content' => $request->input('content'),
            'user_id' => Auth::id(),
        ]);

        return $this->success(new NoteResource($note), 'Note added successfully.', 201);
    }

    /**
     * Merge Contact
     *
     * Merge this contact into another contact.
     */
    public function merge(Request $request, Contact $contact)
    {
        $request->validate([
            'target_contact_id' => ['required', 'uuid', 'exists:contacts,id', 'different:id'],
        ]);

        $targetContact = Contact::findOrFail($request->input('target_contact_id'));

        // 1. Move Conversations
        Conversation::where('contact_id', $contact->id)
            ->update(['contact_id' => $targetContact->id]);

        // 2. Move Visitors
        $contact->visitors()->update(['contact_id' => $targetContact->id]);

        // 3. Move Notes
        Note::where('notable_type', Contact::class)
            ->where('notable_id', $contact->id)
            ->update(['notable_id' => $targetContact->id]);

        // 4. Mark as merged
        $contact->update(['merged_into_contact_id' => $targetContact->id]);

        // 5. Delete source
        $contact->delete();

        return $this->success(new ContactResource($targetContact), 'Contact merged successfully.');
    }
}
