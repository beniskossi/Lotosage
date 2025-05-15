"use client";

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import type { DrawResult } from '@/lib/types';
import { 
    getAllDraws, 
    addSingleDrawResult, 
    updateDrawResult, 
    deleteDrawResult, 
    getDrawResults, 
    addDrawResults as bulkAddDrawResults
} from '@/lib/indexeddb';
import { ALL_DRAW_CATEGORIES, FlatDrawCategory } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { PlusCircle, Edit, Trash2, Download, Upload, Filter } from 'lucide-react';
import NumberBall from '@/components/draws/NumberBall'; // For displaying numbers
import { format, parse, isValid, parseISO } from 'date-fns';

type FormData = Omit<DrawResult, 'id'> & { id?: number };

const EMPTY_FORM_DATA: FormData = {
    drawName: '', // Will be apiName
    date: '', // YYYY-MM-DD
    gagnants: [],
    machine: [],
};

export default function AdminDrawsPage() {
    const [draws, setDraws] = useState<DrawResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDrawCategory, setSelectedDrawCategory] = useState<string>('all'); // 'all' or apiName
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentDraw, setCurrentDraw] = useState<FormData>(EMPTY_FORM_DATA);
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();

    const fetchDraws = useCallback(async () => {
        setIsLoading(true);
        try {
            let results;
            if (selectedDrawCategory === 'all') {
                results = await getAllDraws();
            } else {
                results = await getDrawResults(selectedDrawCategory);
            }
            setDraws(results);
        } catch (error) {
            console.error("Failed to fetch draws:", error);
            toast({ title: "Erreur", description: "Impossible de charger les tirages.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [selectedDrawCategory, toast]);

    useEffect(() => {
        fetchDraws();
    }, [fetchDraws]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "gagnants" || name === "machine") {
            const numbers = value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 90);
            setCurrentDraw(prev => ({ ...prev, [name]: numbers }));
        } else {
            setCurrentDraw(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleDrawNameChange = (apiName: string) => {
        setCurrentDraw(prev => ({...prev, drawName: apiName}));
    }

    const validateFormData = (data: FormData): boolean => {
        if (!data.drawName) {
            toast({ title: "Validation échouée", description: "Veuillez sélectionner un nom de tirage.", variant: "destructive" });
            return false;
        }
        if (!data.date || !isValid(parseISO(data.date))) {
             toast({ title: "Validation échouée", description: "Veuillez entrer une date valide (YYYY-MM-DD).", variant: "destructive" });
            return false;
        }
        if (!data.gagnants || data.gagnants.length === 0 || data.gagnants.some(n => n < 1 || n > 90)) {
            toast({ title: "Validation échouée", description: "Numéros gagnants invalides (doivent être entre 1-90).", variant: "destructive" });
            return false;
        }
        if (data.machine && data.machine.some(n => n < 1 || n > 90)) {
            toast({ title: "Validation échouée", description: "Numéros machine invalides (doivent être entre 1-90).", variant: "destructive" });
            return false;
        }
        return true;
    }

    const handleSubmit = async () => {
        if (!validateFormData(currentDraw)) return;

        try {
            if (isEditing && currentDraw.id) {
                await updateDrawResult(currentDraw as DrawResult);
                toast({ title: "Succès", description: "Tirage mis à jour." });
            } else {
                const { id, ...newDrawData } = currentDraw; // remove id if present
                await addSingleDrawResult(newDrawData);
                toast({ title: "Succès", description: "Tirage ajouté." });
            }
            setIsFormOpen(false);
            fetchDraws();
        } catch (error: any) {
            console.error("Failed to save draw:", error);
            toast({ title: "Erreur", description: error.message || "Impossible d'enregistrer le tirage.", variant: "destructive" });
        }
    };

    const openEditForm = (draw: DrawResult) => {
        setCurrentDraw({
            ...draw,
            gagnants: [...draw.gagnants], // Create copies to avoid direct state mutation
            machine: draw.machine ? [...draw.machine] : []
        });
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const openAddForm = () => {
        setCurrentDraw(EMPTY_FORM_DATA);
        setIsEditing(false);
        setIsFormOpen(true);
    };

    const handleDelete = async (id?: number) => {
        if (id === undefined) return;
        if (confirm("Êtes-vous sûr de vouloir supprimer ce tirage ?")) {
            try {
                await deleteDrawResult(id);
                toast({ title: "Succès", description: "Tirage supprimé." });
                fetchDraws();
            } catch (error) {
                console.error("Failed to delete draw:", error);
                toast({ title: "Erreur", description: "Impossible de supprimer le tirage.", variant: "destructive" });
            }
        }
    };

    const handleExport = async () => {
        try {
            const allData = await getAllDraws();
            const jsonString = `data:text/json;charset=utf-f8,${encodeURIComponent(JSON.stringify(allData, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `loto_stats_export_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            toast({ title: "Exportation Réussie", description: "Les données ont été téléchargées." });
        } catch (error) {
            toast({ title: "Erreur d'Exportation", description: "Impossible d'exporter les données.", variant: "destructive" });
        }
    };

    const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') throw new Error("Contenu du fichier invalide.");
                const importedData: DrawResult[] = JSON.parse(content);
                
                // Basic validation of imported structure (can be more thorough)
                if (!Array.isArray(importedData) || !importedData.every(item => item.drawName && item.date && Array.isArray(item.gagnants))) {
                    throw new Error("Format de données invalide. Assurez-vous que c'est un tableau de tirages valides.");
                }

                await bulkAddDrawResults(importedData); // Uses existing bulk add which handles duplicates
                toast({ title: "Importation Réussie", description: `${importedData.length} tirages traités.` });
                fetchDraws();
            } catch (error: any) {
                toast({ title: "Erreur d'Importation", description: error.message || "Impossible d'importer le fichier.", variant: "destructive" });
            } finally {
                // Reset file input
                if (event.target) event.target.value = "";
            }
        };
        reader.readAsText(file);
    };


    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Tirages</CardTitle>
                    <CardDescription>Ajouter, modifier ou supprimer des résultats de tirages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-2">
                            <Button onClick={openAddForm}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter un Tirage</Button>
                            <Button onClick={handleExport} variant="outline"><Download className="mr-2 h-4 w-4" /> Exporter Tout (JSON)</Button>
                             <Label htmlFor="import-file" className={Button.prototype.constructor.variants({ variant: 'outline' })}>
                                <Upload className="mr-2 h-4 w-4" /> Importer (JSON)
                            </Label>
                            <Input id="import-file" type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </div>
                        <div className="w-full sm:w-auto min-w-[250px]">
                            <Label htmlFor="category-filter" className="mb-1 block text-sm">Filtrer par catégorie de tirage</Label>
                            <Select value={selectedDrawCategory} onValueChange={setSelectedDrawCategory}>
                                <SelectTrigger id="category-filter">
                                    <Filter className="mr-2 h-4 w-4 opacity-50" />
                                    <SelectValue placeholder="Sélectionner une catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les tirages</SelectItem>
                                    {ALL_DRAW_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.apiName} value={cat.apiName}>{cat.name} ({cat.day} {cat.time})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><LoadingSpinner size={48} /></div>
            ) : draws.length === 0 ? (
                 <Card className="text-center py-10">
                    <CardContent>
                        <p className="text-xl text-muted-foreground">Aucun tirage trouvé pour cette sélection.</p>
                    </CardContent>
                 </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Tirages ({draws.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Nom du Tirage</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Gagnants</TableHead>
                                        <TableHead>Machine</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draws.map(draw => (
                                        <TableRow key={draw.id}>
                                            <TableCell>{draw.id}</TableCell>
                                            <TableCell>{ALL_DRAW_CATEGORIES.find(c => c.apiName === draw.drawName)?.name || draw.drawName}</TableCell>
                                            <TableCell>{format(parseISO(draw.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1 flex-wrap">
                                                    {draw.gagnants.map(n => <NumberBall key={`g-${n}-${draw.id}`} number={n} size="sm" />)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {draw.machine && draw.machine.length > 0 ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {draw.machine.map(n => <NumberBall key={`m-${n}-${draw.id}`} number={n} size="sm" />)}
                                                    </div>
                                                ) : <span className="text-xs text-muted-foreground">N/A</span>}
                                            </TableCell>
                                            <TableCell className="space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => openEditForm(draw)}><Edit className="h-3 w-3" /></Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(draw.id)}><Trash2 className="h-3 w-3" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Modifier le Tirage" : "Ajouter un Tirage"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="drawName">Nom du Tirage</Label>
                             <Select value={currentDraw.drawName} onValueChange={handleDrawNameChange}>
                                <SelectTrigger id="drawName">
                                    <SelectValue placeholder="Sélectionner un nom de tirage" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_DRAW_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.apiName} value={cat.apiName}>{cat.name} ({cat.day} {cat.time})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="date">Date (YYYY-MM-DD)</Label>
                            <Input id="date" name="date" type="date" value={currentDraw.date} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label htmlFor="gagnants">Numéros Gagnants (séparés par virgule)</Label>
                            <Input id="gagnants" name="gagnants" value={currentDraw.gagnants.join(', ')} onChange={handleInputChange} placeholder="Ex: 1,2,3,4,5" />
                        </div>
                        <div>
                            <Label htmlFor="machine">Numéros Machine (optionnel, séparés par virgule)</Label>
                            <Input id="machine" name="machine" value={currentDraw.machine?.join(', ') || ''} onChange={handleInputChange} placeholder="Ex: 6,7,8,9,10" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
                        <Button onClick={handleSubmit}>{isEditing ? "Enregistrer les modifications" : "Ajouter le Tirage"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
