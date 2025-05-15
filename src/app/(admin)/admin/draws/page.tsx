
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
import { Button, buttonVariants } from '@/components/ui/button';
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
import NumberBall from '@/components/draws/NumberBall';
import { format, parse, isValid, parseISO } from 'date-fns';

type FormData = Omit<DrawResult, 'id'> & { id?: number };

const EMPTY_FORM_DATA: FormData = {
    drawName: '', 
    date: '', // YYYY-MM-DD
    gagnants: [],
    machine: [],
};

export default function AdminDrawsPage() {
    const [draws, setDraws] = useState<DrawResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDrawCategory, setSelectedDrawCategory] = useState<string>('all');
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
            let errorMessage = "Impossible de charger les tirages.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
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
            const numbers = value.split(',')
                                 .map(n => n.trim()) 
                                 .filter(nStr => nStr !== '') 
                                 .map(nStr => parseInt(nStr)) 
                                 .filter(n => !isNaN(n) && n >= 1 && n <= 90); 
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
            toast({ title: "Validation échouée", description: "Numéros gagnants invalides (doivent être entre 1-90 et non vides).", variant: "destructive" });
            return false;
        }
        if (data.machine && data.machine.length > 0 && data.machine.some(n => n < 1 || n > 90)) {
            toast({ title: "Validation échouée", description: "Numéros machine invalides (doivent être entre 1-90).", variant: "destructive" });
            return false;
        }
        return true;
    }

    const handleSubmit = async () => {
        if (!validateFormData(currentDraw)) return;

        try {
            const dataToSave = {
                ...currentDraw,
                machine: currentDraw.machine && currentDraw.machine.length > 0 ? currentDraw.machine : [],
            };

            if (isEditing && dataToSave.id) {
                await updateDrawResult(dataToSave as DrawResult);
                toast({ title: "Succès", description: "Tirage mis à jour." });
            } else {
                const { id, ...newDrawData } = dataToSave; 
                await addSingleDrawResult(newDrawData);
                toast({ title: "Succès", description: "Tirage ajouté." });
            }
            setIsFormOpen(false);
            fetchDraws();
        } catch (error) {
            console.error("Failed to save draw:", error);
            let errorMessage = "Impossible d'enregistrer le tirage.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
        }
    };

    const openEditForm = (draw: DrawResult) => {
        setCurrentDraw({
            ...draw,
            date: draw.date ? format(parseISO(draw.date), 'yyyy-MM-dd') : '',
            gagnants: [...draw.gagnants], 
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
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce tirage ?")) {
            try {
                await deleteDrawResult(id);
                toast({ title: "Succès", description: "Tirage supprimé." });
                fetchDraws();
            } catch (error) {
                console.error("Failed to delete draw:", error);
                let errorMessage = "Impossible de supprimer le tirage.";
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                }
                toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
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
            let errorMessage = "Impossible d'exporter les données.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast({ title: "Erreur d'Exportation", description: errorMessage, variant: "destructive" });
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
                
                let importedData: any[] = JSON.parse(content);
                if (!Array.isArray(importedData)) {
                     throw new Error("Le fichier JSON doit contenir un tableau de tirages.");
                }

                const validDrawResults: Omit<DrawResult, 'id'>[] = importedData.map((item: any, index: number) => {
                    if (!item.drawName || typeof item.drawName !== 'string' ||
                        !item.date || typeof item.date !== 'string' || !isValid(parseISO(item.date)) ||
                        !Array.isArray(item.gagnants) || item.gagnants.some((n: any) => typeof n !== 'number' || n < 1 || n > 90) || item.gagnants.length === 0) {
                        throw new Error(`Format de données invalide pour l'élément ${index + 1}. Vérifiez drawName, date, et gagnants.`);
                    }
                    const machine = (Array.isArray(item.machine) && item.machine.every((n: any) => typeof n === 'number' && n >= 1 && n <= 90)) 
                                    ? item.machine 
                                    : [];
                    return {
                        drawName: item.drawName,
                        date: format(parseISO(item.date), 'yyyy-MM-dd'), 
                        gagnants: item.gagnants,
                        machine: machine,
                    };
                });
                
                await bulkAddDrawResults(validDrawResults as DrawResult[]);
                toast({ title: "Importation Réussie", description: `${validDrawResults.length} tirages traités.` });
                fetchDraws();
            } catch (error: any) {
                let errorMessage = "Impossible d'importer le fichier.";
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                }
                toast({ title: "Erreur d'Importation", description: errorMessage, variant: "destructive" });
            } finally {
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
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={openAddForm}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter un Tirage</Button>
                            <Button onClick={handleExport} variant="outline"><Download className="mr-2 h-4 w-4" /> Exporter Tout (JSON)</Button>
                             <Label htmlFor="import-file" className={buttonVariants({ variant: 'outline' })}>
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
                        <p className="text-sm text-muted-foreground mt-1">Essayez d'ajouter des tirages ou de changer le filtre.</p>
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
                                        <TableHead className="w-[50px]">ID</TableHead>
                                        <TableHead>Nom du Tirage</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Gagnants</TableHead>
                                        <TableHead>Machine</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draws.map(draw => (
                                        <TableRow key={draw.id}>
                                            <TableCell>{draw.id}</TableCell>
                                            <TableCell>{ALL_DRAW_CATEGORIES.find(c => c.apiName === draw.drawName)?.name || draw.drawName}</TableCell>
                                            <TableCell>{draw.date ? format(parseISO(draw.date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1 flex-wrap">
                                                    {draw.gagnants.map((n, idx) => <NumberBall key={`g-${n}-${draw.id}-${idx}`} number={n} size="sm" />)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {draw.machine && draw.machine.length > 0 ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {draw.machine.map((n, idx) => <NumberBall key={`m-${n}-${draw.id}-${idx}`} number={n} size="sm" />)}
                                                    </div>
                                                ) : <span className="text-xs text-muted-foreground">N/A</span>}
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
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
                <DialogContent 
                    key={isEditing && currentDraw.id !== undefined ? `draw-edit-${currentDraw.id}` : `draw-add-${Date.now()}`} 
                    className="sm:max-w-[525px]"
                    onCloseAutoFocus={(e) => e.preventDefault()} 
                >
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Modifier le Tirage" : "Ajouter un Tirage"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="form-drawName">Nom du Tirage</Label>
                             <Select value={currentDraw.drawName} onValueChange={handleDrawNameChange}>
                                <SelectTrigger id="form-drawName">
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
                            <Label htmlFor="form-date">Date (YYYY-MM-DD)</Label>
                            <Input id="form-date" name="date" type="date" value={currentDraw.date} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label htmlFor="form-gagnants">Numéros Gagnants (séparés par virgule)</Label>
                            <Input id="form-gagnants" name="gagnants" value={currentDraw.gagnants?.join(', ') || ''} onChange={handleInputChange} placeholder="Ex: 1,2,3,4,5" />
                        </div>
                        <div>
                            <Label htmlFor="form-machine">Numéros Machine (optionnel, séparés par virgule)</Label>
                            <Input id="form-machine" name="machine" value={currentDraw.machine?.join(', ') || ''} onChange={handleInputChange} placeholder="Ex: 6,7,8,9,10" />
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

