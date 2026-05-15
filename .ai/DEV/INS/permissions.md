CREATE A CONSTANT FOR PERMISSIONS ON ALL AVAILABLE ROLES, THEN MAKE A SEEDER THAT USES THE CONSTANT 
FOR GENERATING PERMISIONS FOR EACH ROLE, IT SHOULD FIRST CREATE OR UPDATE THE PERMISSIONS TABLE AND THEN ASSIGN TO ROLES

Cool. Next step: I’ll define a clean Laratrust permission map (20+ permissions) that matches the PRD and your endpoints, so your backend AI can implement RBAC consistently.

Permission Groups (Laratrust)

A) System
1.	system.settings.view
2.	system.settings.update
3.	system.logs.view

B) Users & Roles
4.	users.view
5.	users.create
6.	users.update
7.	users.deactivate
8.	roles.view
9.	roles.assign
10.	permissions.assign

C) Widgets
11.	widgets.view
12.	widgets.create
13.	widgets.update
14.	widgets.delete
15.	widgets.rotate_key
16.	widget_domains.manage

D) Departments
17.	departments.view
18.	departments.create
19.	departments.update
20.	departments.delete
21.	departments.assign_users
22.	departments.assign_widgets

E) Conversations (Inbox)
23.	conversations.view
24.	conversations.reply
25.	conversations.note
26.	conversations.assign
27.	conversations.transfer
28.	conversations.close
29.	conversations.reopen
30.	conversations.join_group
31.	conversations.leave_group
32.	conversations.tags.manage
33.	conversations.priority.manage

F) Messages & Attachments
34.	messages.view
35.	messages.delete
36.	attachments.upload
37.	attachments.delete
38.	messages.star

G) Canned Replies
39.	canned_replies.view
40.	canned_replies.create
41.	canned_replies.update
42.	canned_replies.delete
43.	canned_replies.shared.manage

H) Bot & Blacklist
44.	bot_rules.view
45.	bot_rules.manage
46.	blocked_urls.view
47.	blocked_urls.manage

I) Feedback & Reports
48.	ratings.view
49.	reports.view
50.	reports.export

J) Notifications & Devices
51.	notifications.view
52.	notifications.send
53.	devices.manage

K) AI
54.	ai.use
55.	ai.settings.manage

⸻

Default Role Permission Sets

admin
•	All permissions (full access)

agent
•	Recommended default:
•	widgets.view, departments.view
•	conversations.view, conversations.reply, conversations.note
•	conversations.join_group, conversations.leave_group
•	conversations.transfer (optional, if you want only supervisors to transfer)
•	messages.view, attachments.upload, messages.star
•	canned_replies.view, canned_replies.create, canned_replies.update
•	ratings.view, reports.view
•	ai.use (optional)

⸻

Seeder Requirements (Laratrust)

Your seeders should:
•	Create roles: admin, agent
•	Create all permissions above
•	Assign all permissions to admin
•	Assign the agent subset to agent
•	Create the admin user and attach admin
