-- Add sample leads data
INSERT INTO public.leads (name, phone, email, purpose, status, notes, created_by)
VALUES
('Alice Smith', '123-456-7890', 'alice.smith@email.com', 'application_process', 'new', 'Interested in Masters in Computer Science', (SELECT id FROM public.profiles LIMIT 1)),
('Bob Johnson', '987-654-3210', 'bob.j@email.com', 'language_class', 'in_progress', 'Wants to improve IELTS score', (SELECT id FROM public.profiles LIMIT 1)),
('Charlie Brown', '555-123-4567', 'charlie.b@email.com', 'application_process', 'converted', 'Successfully admitted to university', (SELECT id FROM public.profiles LIMIT 1)),
('Diana Prince', '444-555-6666', 'diana.prince@email.com', 'language_class', 'new', 'TOEFL preparation needed', (SELECT id FROM public.profiles LIMIT 1)),
('Edward Wilson', '333-444-5555', 'edward.w@email.com', 'application_process', 'in_progress', 'Applying for MBA programs', (SELECT id FROM public.profiles LIMIT 1));