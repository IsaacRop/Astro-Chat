"use client";

import * as React from "react";
import {
    add,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    getDay,
    isEqual,
    isSameDay,
    isSameMonth,
    isToday,
    parse,
    startOfToday,
    startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusCircleIcon,
    CheckSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface CalendarEvent {
    id: string;
    name: string;
    time?: string;
    datetime: string;
    type: "event" | "task";
    status?: string;
}

export interface CalendarData {
    day: Date;
    events: CalendarEvent[];
}

interface FullScreenCalendarProps {
    data: CalendarData[];
    onAddEvent?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

const colStartClasses = [
    "",
    "col-start-2",
    "col-start-3",
    "col-start-4",
    "col-start-5",
    "col-start-6",
    "col-start-7",
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function FullScreenCalendar({
    data,
    onAddEvent,
    onEventClick,
}: FullScreenCalendarProps) {
    const today = startOfToday();
    const [selectedDay, setSelectedDay] = React.useState(today);
    const [currentMonth, setCurrentMonth] = React.useState(
        format(today, "MMM-yyyy")
    );
    const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const days = eachDayOfInterval({
        start: startOfWeek(firstDayCurrentMonth),
        end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
    });

    function previousMonth() {
        const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    }

    function nextMonth() {
        const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    }

    function goToToday() {
        setCurrentMonth(format(today, "MMM-yyyy"));
        setSelectedDay(today);
    }

    const getEventsForDay = (day: Date) => {
        return data.filter((d) => isSameDay(d.day, day)).flatMap((d) => d.events);
    };

    return (
        <div className="flex flex-1 flex-col h-full">
            {/* Calendar Header */}
            <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none border-b border-border">
                <div className="flex flex-auto">
                    <div className="flex items-center gap-4">
                        <div className="hidden w-16 flex-col items-center justify-center rounded-lg border border-border bg-muted p-0.5 md:flex">
                            <h1 className="p-1 text-[10px] uppercase text-muted-foreground font-medium">
                                {format(today, "MMM", { locale: ptBR })}
                            </h1>
                            <div className="flex w-full items-center justify-center rounded-md border border-border bg-background p-1 text-lg font-bold text-foreground">
                                <span>{format(today, "d")}</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold text-foreground capitalize">
                                {format(firstDayCurrentMonth, "MMMM yyyy", { locale: ptBR })}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {format(firstDayCurrentMonth, "d MMM", { locale: ptBR })} -{" "}
                                {format(endOfMonth(firstDayCurrentMonth), "d MMM yyyy", {
                                    locale: ptBR,
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 md:flex-row md:gap-4">
                    <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm md:w-auto">
                        <Button
                            onClick={previousMonth}
                            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                            variant="outline"
                            size="icon"
                            aria-label="Mês anterior"
                        >
                            <ChevronLeftIcon size={16} strokeWidth={2} />
                        </Button>
                        <Button
                            onClick={goToToday}
                            className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto px-4"
                            variant="outline"
                        >
                            Hoje
                        </Button>
                        <Button
                            onClick={nextMonth}
                            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                            variant="outline"
                            size="icon"
                            aria-label="Próximo mês"
                        >
                            <ChevronRightIcon size={16} strokeWidth={2} />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="hidden h-6 md:block" />

                    {onAddEvent && (
                        <Button
                            onClick={() => onAddEvent(selectedDay)}
                            className="w-full gap-2 md:w-auto bg-gradient-to-r from-accent-blue to-accent-purple hover:opacity-90 text-background"
                        >
                            <PlusCircleIcon size={16} strokeWidth={2} />
                            <span>Novo Evento</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b border-border text-center text-xs font-semibold leading-6 text-muted-foreground">
                    {weekDays.map((day, idx) => (
                        <div
                            key={day}
                            className={cn("py-2.5", idx < 6 && "border-r border-border")}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="flex flex-1 text-xs leading-6 overflow-auto">
                    {/* Desktop Grid */}
                    <div className="hidden w-full md:grid md:grid-cols-7 md:auto-rows-fr border-l border-border">
                        {days.map((day, dayIdx) => {
                            const dayEvents = getEventsForDay(day);
                            const isSelected = isEqual(day, selectedDay);
                            const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);

                            return (
                                <div
                                    key={dayIdx}
                                    onClick={() => setSelectedDay(day)}
                                    className={cn(
                                        dayIdx === 0 && colStartClasses[getDay(day)],
                                        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                                        "relative flex flex-col border-b border-r border-border cursor-pointer transition-colors",
                                        !isSelected && "hover:bg-muted/50",
                                        isSelected && "bg-accent-purple/10"
                                    )}
                                >
                                    <header className="flex items-center justify-between p-2">
                                        <button
                                            type="button"
                                            className={cn(
                                                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                                                isToday(day) &&
                                                "bg-accent-purple text-background font-bold",
                                                isSelected &&
                                                !isToday(day) &&
                                                "bg-accent-blue text-background",
                                                !isSelected &&
                                                !isToday(day) &&
                                                "hover:bg-muted text-foreground"
                                            )}
                                        >
                                            <time dateTime={format(day, "yyyy-MM-dd")}>
                                                {format(day, "d")}
                                            </time>
                                        </button>
                                    </header>

                                    {/* Events */}
                                    <div className="flex-1 px-2 pb-2 space-y-1 overflow-hidden">
                                        {dayEvents.slice(0, 2).map((event) => (
                                            <div
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick?.(event);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] leading-tight truncate cursor-pointer transition-colors",
                                                    event.type === "task"
                                                        ? "bg-accent-green/20 text-accent-green border border-accent-green/30 hover:bg-accent-green/30"
                                                        : "bg-accent-blue/20 text-accent-blue border border-accent-blue/30 hover:bg-accent-blue/30"
                                                )}
                                            >
                                                {event.type === "task" && (
                                                    <CheckSquare size={10} className="flex-shrink-0" />
                                                )}
                                                <span className="truncate font-medium">
                                                    {event.name}
                                                </span>
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[10px] text-muted-foreground pl-2">
                                                + {dayEvents.length - 2} mais
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile Grid */}
                    <div className="grid w-full grid-cols-7 auto-rows-fr border-l border-border md:hidden">
                        {days.map((day, dayIdx) => {
                            const dayEvents = getEventsForDay(day);
                            const isSelected = isEqual(day, selectedDay);
                            const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);

                            return (
                                <button
                                    onClick={() => setSelectedDay(day)}
                                    key={dayIdx}
                                    type="button"
                                    className={cn(
                                        !isCurrentMonth && "text-muted-foreground bg-muted/30",
                                        "flex h-14 flex-col items-center border-b border-r border-border px-1 py-1.5 hover:bg-muted focus:z-10"
                                    )}
                                >
                                    <time
                                        dateTime={format(day, "yyyy-MM-dd")}
                                        className={cn(
                                            "flex size-6 items-center justify-center rounded-full text-xs",
                                            isToday(day) && "bg-accent-purple text-background font-bold",
                                            isSelected && !isToday(day) && "bg-accent-blue text-background"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </time>
                                    {dayEvents.length > 0 && (
                                        <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                                            {dayEvents.slice(0, 3).map((event) => (
                                                <span
                                                    key={event.id}
                                                    className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        event.type === "task"
                                                            ? "bg-accent-green"
                                                            : "bg-accent-blue"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Details (Mobile) */}
                <div className="md:hidden border-t border-border p-4 bg-card">
                    <h3 className="font-semibold text-foreground mb-3 capitalize">
                        {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <div className="space-y-2">
                        {getEventsForDay(selectedDay).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Nenhum evento para este dia
                            </p>
                        ) : (
                            getEventsForDay(selectedDay).map((event) => (
                                <div
                                    key={event.id}
                                    onClick={() => onEventClick?.(event)}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer",
                                        event.type === "task"
                                            ? "bg-accent-green/10 text-foreground border border-accent-green/20"
                                            : "bg-accent-blue/10 text-foreground border border-accent-blue/20"
                                    )}
                                >
                                    {event.type === "task" && (
                                        <CheckSquare size={14} className="text-accent-green" />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium">{event.name}</p>
                                        {event.time && (
                                            <p className="text-xs text-muted-foreground">
                                                {event.time}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FullScreenCalendar;
