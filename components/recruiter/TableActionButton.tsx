'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";

interface TableActionButtonProps {
    href: string;
    color: 'blue' | 'teal' | 'red';
    children: ReactNode;
    title?: string;
    className?: string;
}

const colorStyles = {
    blue: {
        bg: '#3b82f6',
        hover: '#2563eb'
    },
    teal: {
        bg: '#14b8a6',
        hover: '#0d9488'
    },
    red: {
        bg: '#ef4444',
        hover: '#dc2626'
    }
};

export function TableActionButton({ 
    href, 
    color, 
    children, 
    title,
    className = ""
}: TableActionButtonProps) {
    const colors = colorStyles[color];
    
    return (
        <Link href={href}>
            <Button
                size="sm"
                variant="outline"
                className={`shadow-md ${className}`}
                title={title}
                style={{ 
                    backgroundColor: colors.bg,
                    color: 'white',
                    border: 'none'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.hover;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg;
                }}
            >
                {children}
            </Button>
        </Link>
    );
}


