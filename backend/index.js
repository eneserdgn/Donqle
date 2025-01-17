const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Projects Routes
app.get('/projects', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                pages:pages(
                    *,
                    elements:elements(*)
                )
            `);
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/projects', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([{ name: req.body.name }])
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/projects/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .update({ name: req.body.name })
            .eq('id', req.params.id)
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/projects/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pages Routes
app.post('/pages', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pages')
            .insert([{
                name: req.body.name,
                project_id: req.body.project_id
            }])
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/pages/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pages')
            .update({ name: req.body.name })
            .eq('id', req.params.id)
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/pages/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('pages')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Elements Routes
app.post('/elements', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('elements')
            .insert([{
                page_id: req.body.page_id,
                selector_type: req.body.selector_type,
                selector_value: req.body.selector_value,
                action_type: req.body.action_type,
                action_value: req.body.action_value
            }])
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/elements/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('elements')
            .update({
                selector_type: req.body.selector_type,
                selector_value: req.body.selector_value,
                action_type: req.body.action_type,
                action_value: req.body.action_value
            })
            .eq('id', req.params.id)
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/elements/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('elements')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ message: 'Element deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 