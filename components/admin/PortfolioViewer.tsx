'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link2, AlertCircle } from "lucide-react";

interface PortfolioViewerProps {
    portfolioUrl: string | null;
}

export function PortfolioViewer({ portfolioUrl }: PortfolioViewerProps) {
    if (!portfolioUrl) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Portfolio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">Portfolio tidak diunggah</p>
                </CardContent>
            </Card>
        );
    }

    // Validasi apakah URL valid
    const isValidUrl = portfolioUrl && (
        portfolioUrl.startsWith('http://') || 
        portfolioUrl.startsWith('https://') ||
        portfolioUrl.startsWith('www.')
    );

    if (!isValidUrl) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Portfolio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">Format URL tidak valid</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{portfolioUrl}</p>
                </CardContent>
            </Card>
        );
    }

    // Format URL untuk dibuka
    const formattedUrl = portfolioUrl.startsWith('www.') 
        ? `https://${portfolioUrl}` 
        : portfolioUrl;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Portfolio
                </CardTitle>
                <CardDescription>
                    Link portfolio yang telah diupload oleh pelamar
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Link2 className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">Link Portfolio</p>
                            <a 
                                href={formattedUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
                            >
                                {portfolioUrl}
                            </a>
                        </div>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(formattedUrl, '_blank')}
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Buka Portfolio
                </Button>
            </CardContent>
        </Card>
    );
}

